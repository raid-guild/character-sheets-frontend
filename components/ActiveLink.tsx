import { Link, LinkProps } from '@chakra-ui/react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';

export const ActiveLink: React.FC<LinkProps> = ({ href, ...props }) => {
  const { pathname } = useRouter();
  const isActive = pathname === href;

  return (
    <Link
      as={NextLink}
<<<<<<< HEAD
      fontSize='18px'
      fontFamily={'texturina'}
      href={href ?? ''}
      color={isActive ?'primary.500':'white'}
=======
      fontSize="18px"
      fontFamily={'texturina'}
      href={href ?? ''}
      color={isActive ? 'primary.500' : 'white'}
>>>>>>> 12e7e6ec90becf7bdf8fc18a02bdc0a63076cccd
      mx={4}
      fontWeight={isActive ? 'extrabold' : 'normal'}
      _hover={{ opacity: '1', fontWeight: 'extrabold' }}
      opacity={isActive ? '1' : '0.8'}
      {...props}
    >
      <>
<<<<<<< HEAD
      {isActive ? '• ' : null}
      {props.children}
=======
        {isActive ? '• ' : null}
        {props.children}
>>>>>>> 12e7e6ec90becf7bdf8fc18a02bdc0a63076cccd
      </>
    </Link>
  );
};
