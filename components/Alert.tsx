import {
  Alert as ChakraAlert,
  AlertDescription,
  AlertIcon,
  HStack,
  VStack,
} from '@chakra-ui/react';

type AlertProps = {
  children: React.ReactNode;
};

export const Alert: React.FC<AlertProps> = ({ children }) => {
  return (
    <VStack align="center" w="100%" mb={8}>
      <ChakraAlert status="warning" w="auto" borderRadius="0">
        <AlertIcon />
        <AlertDescription color="dark">
          <HStack>{children}</HStack>
        </AlertDescription>
      </ChakraAlert>
    </VStack>
  );
};
