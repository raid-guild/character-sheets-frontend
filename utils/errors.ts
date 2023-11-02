export const USER_ERRORS = ['User denied signature'];

export const getErrorMessage = (
  error: unknown,
  defaultError: string = 'Unknown error',
): string => {
  console.error(error);
  if (typeof error === 'string') {
    return error;
  }

  if ((error as Error)?.message?.toLowerCase().includes('user denied')) {
    return USER_ERRORS[0];
  }

  return (error as Error)?.message || defaultError;
};
