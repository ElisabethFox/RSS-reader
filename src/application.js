import onChange from 'on-change';
import axios from 'axios';
import { string, setLocale } from 'yup';

import uniqueId from 'lodash/uniqueId.js';
import i18next from 'i18next';
import resources from './locales/index.js';
import render from './view.js';
import parser from './parser.js';

const defaultLanguage = 'ru';
const timeout = 5000;

const validate = (url, urlList) => {
  const schema = string().trim().required().url().notOneOf(urlList);
  return schema.validate(url);
};

const getAxiosResponse = (url) => {
  const allOrigins = 'https://allorigins.hexlet.app/get';
  const newUrl = new URL(allOrigins);
  newUrl.searchParams.set('url', url);
  newUrl.searchParams.set('disableCache', 'true');
  return axios.get(newUrl);
};

const createPosts = (state, newPosts, id) => {
  const preparedPosts = newPosts.forEach((post) => ({ ...post, id }));
  const actualPosts = state.contentValue.posts.concat(preparedPosts);
  return actualPosts;
};

const getNewPosts = (state) => {
  const promises = state.contentValue.feeds
    .map(({ link, id }) => getAxiosResponse(link)
      .then((response) => {
        const { posts } = parser(response.data.contents);
        const addedPosts = state.contentValue.posts.map((post) => post.link);
        const newPosts = posts.filter((post) => !addedPosts.includes(post.link));
        if (newPosts.length > 0) {
          createPosts(state, newPosts, id);
        }
        return Promise.resolve();
      }));

  Promise.allSettled(promises)
    .finally(() => {
      setTimeout(() => getNewPosts(state), timeout);
    });
};

export default () => {
  const i18nInstance = i18next.createInstance();
  i18nInstance.init({
    lng: defaultLanguage,
    debug: true,
    resources,
  }).then(() => {
    const elements = {
      form: document.querySelector('.rss-form'),
      input: document.querySelector('input[id="url-input"]'),
      button: document.querySelector('button[type="submit"]'),
      feedback: document.querySelector('.feedback'),
      feedsContainer: document.querySelector('.feeds'),
      postsContainer: document.querySelector('.posts'),
      modal: {
        modalWindow: document.querySelector('.modal'),
        title: document.querySelector('.modal-title'),
        body: document.querySelector('.modal-body'),
        button: document.querySelector('.full-article'),
      },
    };

    setLocale({
      mixed: {
        notOneOf: 'errors.doubleRss',
      },
      string: {
        url: 'errors.invalidUrl',
      },
    });

    const initialState = {
      valid: true,
      inputValue: '',
      fieldUi: {
        url: false,
      },
      process: {
        processState: 'filling',
        error: null,
      },
      contentValue: {
        posts: [],
        feeds: [],
      },
      uiState: {
        visitedLinksId: new Set(),
        modalId: null,
      },
    };

    const watchedState = onChange(initialState, render(elements, initialState, i18nInstance));
    getNewPosts(watchedState);

    elements.form.addEventListener('input', (e) => {
      e.preventDefault();
      watchedState.process.processState = 'filling';
    });

    elements.form.addEventListener('submit', (e) => {
      e.preventDefault();
      const urlList = watchedState.contentValue.feeds.map(({ link }) => link);
      const formData = new FormData(elements.form);
      const url = formData.get('url');

      validate(url, urlList)
        .then((link) => {
          watchedState.valid = true;
          watchedState.process.processState = 'sending';
          return getAxiosResponse(link);
        })
        .then((response) => {
          const content = response.data.contents;
          const { feed, posts } = parser(content);
          const feedId = uniqueId();

          watchedState.contentValue.feeds.push({ ...feed, feedId, link: url });
          createPosts(watchedState, posts, feedId);

          watchedState.process.processState = 'sucsess';
        })
        .catch((error) => {
          //watchedState.valid = false;
          watchedState.process.error = error.message ?? 'defaultError';
          watchedState.process.processState = 'error';
        });
    });
  });
};