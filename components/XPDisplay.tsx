import { HStack, Image, Text } from '@chakra-ui/react';

export const XPDisplay: React.FC<{
  experience: string;
}> = ({ experience }) => {
  return (
    <HStack spacing={0} align="stretch">
      <Image h="100%" src="/icons/xp-box-left.svg" w="12px" alt="xp-box-left" />
      <HStack
        color="softyellow"
        spacing={4}
        borderTop="2px solid"
        borderBottom="2px solid"
        borderColor="rgba(219, 211, 139, 0.75)"
        mx="-1px"
        px={4}
      >
        <Text fontSize="lg" fontWeight="700">
          {experience}
        </Text>
        <Image alt="users" height="20px" src="/icons/xp.svg" width="20px" />
      </HStack>
      <Image
        h="100%"
        src="/icons/xp-box-left.svg"
        w="12px"
        transform="rotate(180deg)"
        alt="xp-box-right"
      />
    </HStack>
  );
};

export const XPDisplaySmall: React.FC<{
  experience: string;
}> = ({ experience }) => {
  return (
    <HStack align="stretch" h="36px" spacing={0}>
      <Image alt="xp-box-left" h="100%" src="/icons/xp-box-left.svg" w="12px" />
      <HStack
        borderBottom="2px solid"
        borderColor="rgba(219, 211, 139, 0.75)"
        borderTop="2px solid"
        color="softyellow"
        mx="-2px"
        px={4}
      >
        <Text fontSize="sm" fontWeight="700">
          {experience}
        </Text>
      </HStack>
      <Image
        alt="xp-box-right"
        h="100%"
        src="/icons/xp-box-left.svg"
        transform="rotate(180deg)"
        w="12px"
      />
    </HStack>
  );
};
