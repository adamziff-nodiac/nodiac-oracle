import Link from 'next/link'
import Image from 'next/image'

interface LogoLinkProps {
  size?: 'sm' | 'md'
}

export function LogoLink({ size = 'md' }: LogoLinkProps) {
  const w = size === 'sm' ? 100 : 120
  const h = size === 'sm' ? 28 : 32

  return (
    <Link href="/" className="flex items-center gap-3">
      <Image
        src="/logo-dark.svg"
        alt="Nodiac"
        width={w}
        height={h}
        className="dark:hidden"
        priority
      />
      <Image
        src="/logo-light.svg"
        alt="Nodiac"
        width={w}
        height={h}
        className="hidden dark:block"
        priority
      />
    </Link>
  )
}
