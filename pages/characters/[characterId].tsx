import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { isAddress } from 'viem';

export default function CharacterPageOuter(): JSX.Element {
  const {
    query: { characterId },
    push,
    isReady,
  } = useRouter();

  useEffect(() => {
    if (isReady && (!characterId || typeof characterId !== 'string')) {
      push('/');
    }

    if (
      isReady &&
      typeof characterId === 'string' &&
      !isAddress(characterId.split('-')[0])
    ) {
      push('/');
    }
  }, [characterId, isReady, push]);

  return <div>Character: {characterId}</div>;
}
