import {
  Box,
  Image as ChakraImage,
  ImageProps as ChakraImageProps,
  Spinner,
  Text,
} from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';

import { uriToHttp } from '@/utils/helpers';

type ImageProps = Omit<ChakraImageProps, 'src'> & {
  src?: string | string[] | undefined;
  fallbackElement?: React.ReactNode;
};

export const MultiSourceImage: React.FC<ImageProps> = ({
  src,
  fallbackElement = null,
  ...props
}) => {
  const [workingSource, setWorkingSource] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const tryLoadImage = async (sourceUrls: string[]) => {
      setIsLoading(true);
      setError(false);

      for (const src of sourceUrls) {
        try {
          const loadResult = await new Promise<string>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(src);
            img.onerror = () => reject();
            img.src = src;
          });

          setWorkingSource(loadResult);
          setIsLoading(false);
          return;
        } catch (err) {
          continue; // Try next source if current one fails
        }
      }

      // If we get here, all sources failed
      setError(true);
      setIsLoading(false);
    };

    if (src) {
      const sources = Array.isArray(src) ? src : uriToHttp(src);
      tryLoadImage(sources);
    }
  }, [src]);

  if (isLoading) {
    return (
      <Box pos="relative" {...props}>
        <Spinner
          pos="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
        />
      </Box>
    );
  }

  if (error || !workingSource) {
    if (fallbackElement) {
      return fallbackElement;
    }
    return (
      <Box>
        <Text>Failed to load image</Text>
      </Box>
    );
  }

  return <ChakraImage src={workingSource} {...props} />;
};

export default MultiSourceImage;
