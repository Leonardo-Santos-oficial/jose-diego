import { startTransition } from 'react';

export async function submitReactActionForm(form: HTMLFormElement) {
  const reactPropKey = Object.keys(form).find((key) => key.startsWith('__reactProps$'));
  if (!reactPropKey) {
    throw new Error('React props bag not found on form element.');
  }

  const props = (form as Record<string, unknown>)[reactPropKey] as {
    action?: (formData: FormData) => unknown;
  };

  const action = props?.action;

  if (typeof action !== 'function') {
    throw new Error('React action handler missing on form element.');
  }

  await new Promise<void>((resolve, reject) => {
    startTransition(() => {
      Promise.resolve(action(new FormData(form)))
        .then(() => resolve())
        .catch(reject);
    });
  });
}
