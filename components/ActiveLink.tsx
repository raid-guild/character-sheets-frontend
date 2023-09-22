import { Link, LinkProps } from '@chakra-ui/react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';

export const ActiveLink: React.FC<LinkProps> = ({ href, ...props }) => {
  const { pathname } = useRouter();
  const isActive = pathname === href;

  return (
    <Link
      as={NextLink}
      fontSize='18px'
      fontFamily={'texturina'}
      href={href ?? ''}
      color={isActive ?'primary.500':'white'}
      mx={4}
      fontWeight={isActive ? 'extrabold' : 'normal'}
      _hover={{ opacity: '1', fontWeight: 'extrabold' }}
      opacity={isActive ? '1' : '0.8'}
      {...props}
    >
      <>
      {isActive ? '• ' : null}
      {props.children}
      </>
    </Link>
  );
};
