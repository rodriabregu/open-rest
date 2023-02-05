import './style.css';

// document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
//   <div>
//     <a href="https://vitejs.dev" target="_blank">
//       <img src="/vite.svg" class="logo" alt="Vite logo" />
//     </a>
//     <a href="https://www.typescriptlang.org/" target="_blank">
//       <img src="${typescriptLogo}" class="logo vanilla" alt="TypeScript logo" />
//     </a>
//     <h1>Vite + TypeScript</h1>
//     <div class="card">
//       <button id="counter" type="button"></button>
//     </div>
//     <p class="read-the-docs">
//       Click on the Vite and TypeScript logos to learn more
//     </p>
//   </div>
// `

const queryParamsContainer = document.querySelector<HTMLDivElement>(
  '[data-query-params]'
);
const requestHeadersContainer = document.querySelector<HTMLDivElement>(
  '[data-request-headers]'
);
const keyValueTemplate = document.querySelector('[data-key-value-template]');
const form = document.querySelector<HTMLFormElement>('[data-form]');

document
  ?.querySelector('[data-add-query-param-btn]')
  ?.addEventListener('click', () => {
    queryParamsContainer?.append(createKeyValuePair());
  });

document
  ?.querySelector('[data-add-request-header-btn]')
  ?.addEventListener('click', () => {
    requestHeadersContainer?.append(createKeyValuePair());
  });

queryParamsContainer?.append(createKeyValuePair());
requestHeadersContainer?.append(createKeyValuePair());

form?.addEventListener('submit', (e) => {
  e.preventDefault();

  fetch(
    document.querySelector<HTMLInputElement>('[data-url]')!.value +
      '?' +
      new URLSearchParams(keyValuePairsToObjects(queryParamsContainer)),
    {
      method: document.querySelector<HTMLInputElement>('[data-method]')!.value,
      headers: keyValuePairsToObjects(requestHeadersContainer),
    }
  ).then((res) => {
    document
      .querySelector<HTMLTextAreaElement>('[data-response-section]')!
      .setAttribute('style', 'visibility: show');
    console.log(res);
  });
});

function createKeyValuePair() {
  const element = keyValueTemplate?.content.cloneNode(true);

  element
    .querySelector('[data-remove-btn]')
    .addEventListener('click', (e: any) => {
      e.target.closest('[data-key-value-pair]').remove();
    });

  return element;
}

function keyValuePairsToObjects(container: HTMLDivElement) {
  const pairs = container.querySelectorAll('[data-key-value-pair]');
  return [...pairs].reduce((data, pair) => {
    const key = pair.querySelector('[data-key]').value;
    const value = pair.querySelector('[data-value]').value;

    if (key === '') return data;
    return { ...data, [key]: value };
  }, {});
}
