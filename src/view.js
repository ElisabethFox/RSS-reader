const renderPosts = (state, div, i18nInstance) => {
  const ul = document.createElement('ul');
  ul.classList.add('list-group', 'border-0', 'rounded-0');

  state.contentValue.posts.forEach((post) => {
    const li = document.createElement('li');
    li.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start', 'border-0', 'border-end-0');

    const a = document.createElement('a');
    // a.classList.add('fw-bold', state.uiState.visitedLinksId.has(post.id) ? 'link-secondary' : 'fw-normal');
    // console.log(state.uiState.visitedLinksId.has(post.id))
    a.classList.add(state.uiState.visitedLinksId.has(post.id) ? ('fw-normal', 'link-secondary') : 'fw-bold');
    // if(state.uiState.visitedLinksId.has(post.id)) {
    //   a.classList.add('fw-normal', 'link-secondary')
    // } else {
    //   a.classList.add('fw-bold')
    // }
    // console.log(state.uiState.visitedLinksId)
    // if (state.uiState.visitedLinksId.has(post.id)) {
    //   a.classList.add('link-secondary');
    //   a.classList.remove('fw-bold');
    // } else {
    //   a.classList.add('fw-bold');
    // }
    
    // a.classList.add('fw-normal');

    a.setAttribute('href', post.link);
    a.setAttribute('data-id', post.id);
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener noreferrer');
    a.textContent = post.title;

    a.addEventListener('click', () => {
      state.uiState.visitedLinksId.add(post.id);  
    })

    const button = document.createElement('button');
    button.classList.add('btn', 'btn-outline-primary', 'btn-sm');
    button.setAttribute('type', 'button');
    button.setAttribute('data-id', post.id);
    button.setAttribute('data-bs-toggle', 'modal');
    button.setAttribute('data-bs-target', '#modal');
    button.textContent = i18nInstance.t('button');

    li.append(a, button);
    ul.append(li);
  });

  div.append(ul);
};

const renderFeeds = (state, div) => {
  const ul = document.createElement('ul');
  ul.classList.add('list-group', 'border-0', 'rounded-0');

  state.contentValue.feeds.forEach((feed) => {
    const li = document.createElement('li');
    li.classList.add('list-group-item', 'border-0', 'border-end-0');

    const h3 = document.createElement('h3');
    h3.classList.add('h6', 'm-0');
    h3.textContent = feed.title;

    const p = document.createElement('p');
    p.classList.add('m-0', 'small', 'text-black-50');
    p.textContent = feed.description;

    li.append(h3, p);
    ul.append(li);
  });

  div.append(ul);
};

const createContainer = (type, elements, state, i18nInstance) => { 
  elements[type].textContent = '';

  const divCard = document.createElement('div');
  divCard.classList.add('card', 'border-0');

  const divCardBody = document.createElement('div');
  divCardBody.classList.add('card-body');

  const divCardBodyTitle = document.createElement('h2');
  divCardBodyTitle.classList.add('card-title', 'h4');
  divCardBodyTitle.textContent = i18nInstance.t(type);
 
  divCardBody.append(divCardBodyTitle);
  divCard.append(divCardBody);
  elements[type].append(divCard);

  if (type === 'posts') renderPosts(state, divCard, i18nInstance);
  if (type === 'feeds') renderFeeds(state, divCard);
};

const renderModalWindow = (elements, state, postId) => {
  const currentPost = state.contentValue.posts.find(({ id }) => id === postId);

  elements.modal.title.textContent = currentPost.title;
  elements.modal.body.textContent = currentPost.description;
  elements.modal.button.setAttribute('href', currentPost.link);
};

const handlerSuccessFinish = (elements, i18nInstance) => {
  elements.feedback.classList.remove('text-danger');
  elements.feedback.classList.add('text-success');
  elements.feedback.textContent = i18nInstance.t('sucсess');

  elements.button.removeAttribute('disabled');

  elements.input.removeAttribute('readonly');
  elements.input.focus();
  elements.form.reset();
  elements.input.classList.remove('is-invalid');
};

const handlerFinishWitnError = (elements, error, i18nInstance) => {
  elements.feedback.classList.remove('text-success');
  elements.feedback.classList.add('text-danger');
  elements.feedback.textContent = i18nInstance.t(`errors.${error.replace(/ /g, '')}`);

  if (error !== 'Network Error') {
    elements.input.classList.add('is-invalid');
  }

  elements.button.disabled = false;
  elements.input.disabled = false;
};

const handlerProcessState = (elements, state, value, i18nInstance) => {
  switch (value) {
    case 'filling':
      break;
    case 'finished':
      handlerSuccessFinish(elements, i18nInstance);
      break;
    case 'error':
      handlerFinishWitnError(elements, state.process.error, i18nInstance);
      break;
    case 'sending':
      elements.button.getAttribute('disabled');
      elements.input.getAttribute('readonly');
      break;
    default:
      throw new Error(`Unknown process state: ${value}`);
  }
};

export default (elements, state, i18nInstance) => (path, value) => {
  switch (path) {
    case 'process.processState':
      handlerProcessState(elements, state, value, i18nInstance);
      break;

    case 'process.error':
      handlerFinishWitnError(elements, state.process.error, i18nInstance);
      break;
      
    case 'uiState.modalId':
      renderModalWindow(elements, state, value);
    break;

    case 'contentValue.posts':
      createContainer('posts', elements, state, i18nInstance);
      break;

    case 'contentValue.feeds':
      createContainer('feeds', elements, state, i18nInstance);
      break;

    default:
      break;
  }
};
