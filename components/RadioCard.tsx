import { Box, useRadio, UseRadioProps } from '@chakra-ui/react';

import { Class, Item } from '@/utils/types';

import { ClassCardSmall } from './ClassCard';
import { ItemCardSmall } from './ItemCard';

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
        w={{ base: '120px', sm: '150px' }}
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

type ItemRadioCardProps = UseRadioProps & {
  item: Item;
};

export const ItemRadioCard: React.FC<ItemRadioCardProps> = props => {
  const { getInputProps, getRadioProps } = useRadio(props);

  const input = getInputProps();
  const checkbox = getRadioProps();

  return (
    <Box as="label">
      <input {...input} />
      <Box
        {...checkbox}
        cursor="pointer"
        _checked={{
          color: 'white',
          background: 'black',
        }}
      >
        <ItemCardSmall {...props.item} dummy />
      </Box>
    </Box>
  );
};

type ClassRadioCardProps = UseRadioProps & {
  klass: Class;
};

export const ClassRadioCard: React.FC<ClassRadioCardProps> = props => {
  const { getInputProps, getRadioProps } = useRadio(props);

  const input = getInputProps();
  const checkbox = getRadioProps();

  return (
    <Box as="label">
      <input {...input} />
      <Box
        {...checkbox}
        cursor="pointer"
        _checked={{
          color: 'white',
          background: 'black',
        }}
      >
        <ClassCardSmall {...props.klass} dummy />
      </Box>
    </Box>
  );
};
