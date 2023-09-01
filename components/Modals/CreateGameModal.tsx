import {
  Button,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Image,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  Tooltip,
  VStack,
} from '@chakra-ui/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { isAddress } from 'viem';

type CreateGameModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const CreateGameModal: React.FC<CreateGameModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [gameMasters, setGameMasters] = useState<string>('');
  const [daoAddress, setDaoAddress] = useState<string>('');
  // const [defaultCharacterImage, setDefaultCharacterImage] =
  //   useState<File | null>(null);

  const [showError, setShowError] = useState<boolean>(false);

  const invalidGameMasterAddress = useMemo(() => {
    const addresses = gameMasters.split(',');
    const trimmedAddresses = addresses.map(address => address.trim());
    return (
      trimmedAddresses.some(address => !isAddress(address)) && !!gameMasters
    );
  }, [gameMasters]);

  const invalidDaoAddress = useMemo(() => {
    return !isAddress(daoAddress) && !!daoAddress;
  }, [daoAddress]);

  const hasError = useMemo(() => {
    return invalidGameMasterAddress || invalidDaoAddress || !gameMasters;
  }, [gameMasters, invalidGameMasterAddress, invalidDaoAddress]);

  useEffect(() => {
    setShowError(false);
  }, [daoAddress, gameMasters]);

  useEffect(() => {
    if (!isOpen) {
      resetData();
    }
  }, [isOpen]);

  const resetData = () => {
    setGameMasters('');
    setDaoAddress('');
    // setDefaultCharacterImage(null);
    setShowError(false);
  };

  const onCreateGame = useCallback(
    async (e: React.FormEvent<HTMLDivElement>) => {
      e.preventDefault();

      if (hasError) {
        setShowError(true);
        return;
      }

      // eslint-disable-next-line no-console
      console.log('create game');
    },
    [hasError],
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <Text>Create a Game</Text>
        </ModalHeader>
        <ModalBody>
          <VStack as="form" mt={10} onSubmit={onCreateGame} spacing={8}>
            <FormControl
              isInvalid={
                showError && (invalidGameMasterAddress || !gameMasters)
              }
            >
              <Flex align="center">
                <FormLabel>
                  GameMasters (separate addresses by commas)
                </FormLabel>
                <Tooltip label="GameMasters act as admins for the entire game. They can do things like change settings, create classes, and create items.">
                  <Image
                    alt="down arrow"
                    height="14px"
                    mb={2}
                    src="/question-mark.svg"
                    width="14px"
                  />
                </Tooltip>
              </Flex>
              <Input
                onChange={e => setGameMasters(e.target.value)}
                type="text"
                value={gameMasters}
              />
              {showError && !gameMasters && (
                <FormHelperText color="red">
                  A GameMaster address is required
                </FormHelperText>
              )}
              {showError && invalidGameMasterAddress && (
                <FormHelperText color="red">
                  Invalid GameMaster address
                </FormHelperText>
              )}
            </FormControl>
            <FormControl isInvalid={showError && invalidDaoAddress}>
              <Flex align="center">
                <FormLabel>DAO Address (optional)</FormLabel>
                <Tooltip label="By adding a DAO address, you restrict who can create characters to only members of that DAO. If you do not provide a DAO address, anyone can create a character by joining an open DAO that we provide.">
                  <Image
                    alt="down arrow"
                    height="14px"
                    mb={2}
                    src="/question-mark.svg"
                    width="14px"
                  />
                </Tooltip>
              </Flex>
              <Input
                onChange={e => setDaoAddress(e.target.value)}
                type="text"
                value={daoAddress}
              />
              {showError && invalidDaoAddress && (
                <FormHelperText color="red">Invalid DAO address</FormHelperText>
              )}
            </FormControl>
            <FormControl>
              <Flex align="center">
                <FormLabel>Default Character Avatar (optional)</FormLabel>
                <Tooltip label="The default character avatar is the image that will render for a character who does not have a class. If you do not provide a default character avatar, we will provide one for you.">
                  <Image
                    alt="down arrow"
                    height="14px"
                    mb={2}
                    src="/question-mark.svg"
                    width="14px"
                  />
                </Tooltip>
              </Flex>
              <Input type="file" variant="file" />
            </FormControl>
            <Button alignSelf="flex-end" type="submit">
              Create
            </Button>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
