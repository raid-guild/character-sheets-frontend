import { Box, useRadio, UseRadioProps } from '@chakra-ui/react';

type RadioCardProps = UseRadioProps & {
  children: React.ReactNode;
};

export const RadioCard: React.FC<RadioCardProps> = props => {
  const { getInputProps, getRadioProps } = useRadio(props);

  const input = getInputProps();
  const checkbox = getRadioProps();

  return (
    <Box as="label">
      <input {...input} />
      <Box
        {...checkbox}
        border="3px solid black"
        borderRight="5px solid black"
        borderBottom="5px solid black"
        cursor="pointer"
        fontWeight={600}
        h="200px"
        w="150px"
        _checked={{
          color: 'white',
          background: 'black',
        }}
        px={5}
        py={3}
      >
        {props.children}
      </Box>
    </Box>
  );
};
