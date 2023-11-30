import { Flex, Switch as ChakraSwitch, Text } from '@chakra-ui/react';
import { useMemo } from 'react';

type SwitchProps = {
  isChecked: boolean;
  onChange: () => void;
};

export const Switch: React.FC<SwitchProps> = ({ isChecked, onChange }) => {
  const randomId = useMemo(() => Math.floor(1000 + Math.random() * 9000), []);
  return (
    <Flex
      as="label"
      align="center"
      gap={4}
      htmlFor={`switch-${randomId}`}
      mt={4}
      w="min-content"
    >
      <Text
        color={isChecked ? 'white' : 'accent'}
        fontSize="sm"
        fontWeight="500"
      >
        No
      </Text>
      <ChakraSwitch
        id={`switch-${randomId}`}
        isChecked={isChecked}
        onChange={onChange}
      />
      <Text
        color={isChecked ? 'accent' : 'white'}
        fontSize="sm"
        fontWeight="500"
      >
        Yes
      </Text>
    </Flex>
  );
};
