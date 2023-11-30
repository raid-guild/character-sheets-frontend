import { useToast as useChakraToast } from '@chakra-ui/react';

import { getErrorMessage, USER_ERRORS } from '@/utils/errors';

export const useToast = (): {
  renderError: (error: unknown, defaultError?: string) => void;
  renderWarning: (msg: string) => void;
  renderSuccess: (msg: string) => void;
} => {
  const toast = useChakraToast();

  const renderError = (error: unknown, defaultError?: string) => {
    const errorMsg = getErrorMessage(error);

    if (USER_ERRORS.includes(errorMsg)) {
      return;
    }

    toast({
      description: getErrorMessage(error, defaultError),
      position: 'top',
      status: 'error',
    });
  };

  const renderWarning = (msg: string) => {
    toast({
      description: msg,
      position: 'top',
      status: 'warning',
    });
  };

  const renderSuccess = (msg: string) => {
    toast({
      description: msg,
      position: 'top',
      status: 'success',
    });
  };

  return { renderError, renderWarning, renderSuccess };
};
