import {
  Alert as ChakraAlert,
  AlertDescription,
  AlertIcon,
  HStack,
  VStack,
} from '@chakra-ui/react';

type AlertProps = {
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export const Alert: React.FC<AlertProps> = ({ children, footer }) => {
  return (
    <VStack align="center" w="100%" mb={8}>
      <ChakraAlert status="warning" w="auto" borderRadius="0">
        <VStack spacing={4}>
          <HStack>
            <AlertIcon />
            <AlertDescription color="dark">
              <HStack>{children}</HStack>
            </AlertDescription>
          </HStack>
          {footer}
        </VStack>
      </ChakraAlert>
    </VStack>
  );
};
