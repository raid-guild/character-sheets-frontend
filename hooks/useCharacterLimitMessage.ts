import { useMemo } from 'react';

export const useCharacterLimitMessage = ({
  characterLimit,
  currentCharacterCount,
}: {
  characterLimit: number;
  currentCharacterCount: number;
}): string => {
  const characterLimitMessage = useMemo(() => {
    if (currentCharacterCount === 0) {
      return `${characterLimit} character limit`;
    } else if (currentCharacterCount > characterLimit) {
      return `${currentCharacterCount - characterLimit} characters over limit`;
    } else {
      return `${characterLimit - currentCharacterCount} characters remaining`;
    }
  }, [characterLimit, currentCharacterCount]);

  return characterLimitMessage;
};
