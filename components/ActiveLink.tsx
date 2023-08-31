import { Link, LinkProps } from '@chakra-ui/react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';

export const ActiveLink: React.FC<LinkProps> = ({ href, ...props }) => {
  const { pathname } = useRouter();
  const isActive = pathname === href;

  return (
    <Link
      as={NextLink}
      href={href ?? ''}
      borderBottom={isActive ? '2px solid black' : '2px solid transparent'}
      _hover={{ borderBottom: '2px solid black' }}
      {...props}
    >
      {props.children}
    </Link>
  );
};
