import { Flex, Switch as ChakraSwitch, Text } from '@chakra-ui/react';

type SwitchProps = {
  isChecked: boolean;
  onChange: () => void;
};

export const Switch: React.FC<SwitchProps> = ({ isChecked, onChange }) => {
  return (
    <Flex align="center" gap={4} mt={4}>
      <Text
        color={isChecked ? 'white' : 'accent'}
        fontSize="sm"
        fontWeight="500"
      >
        No
      </Text>
      <ChakraSwitch isChecked={isChecked} onChange={onChange} />
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
