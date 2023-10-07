import { useMemo } from 'react'
import { getMDXComponent } from 'mdx-bundler/client'
import Link from 'next/link'
import Image from 'next/image'
import Meta from '../meta'
import Frontmatter from './frontmatter'
import styles from './post.module.css'

const CustomLink = ({ as, href, ...otherProps }) => {
  return (
    (<Link as={as} href={href} {...otherProps}>

    </Link>)
  );
}

const CustomImage = ({ src, caption, ...otherProps }) => {
  return (
    <div className={styles.customImageCard}>
      <div className={styles.customImage}>
        <Image src={src} width="100%" height="100%" layout="responsive" objectFit="contain" objectPosition="center" {...otherProps} />
      </div>
      <div className={styles.customImageCaption}>{caption}</div>
    </div>
  )
}

// const CustomImage = ({ src, ...otherProps }) => {
//   return <Image src={src} width="100%" height="100%" layout="responsive" objectFit="contain" objectPosition="top" {...otherProps} />
// }

const CustomImageBlock = ({ children }) => {
  return <div className={styles.customImageBlock}>{children}</div>
}

const CustomCodeBlock = ({ syntax = 'python', children }) => {
  return (
    <div className={styles.customCodeBlock}>
      <code className={`language-${syntax}`}>{children}</code>
    </div>
  )
}

const Post = ({ code, frontmatter }) => {
  const Component = useMemo(() => getMDXComponent(code), [code])
  return (
    <div className={styles.page}>
      <Meta title={frontmatter.title} description={frontmatter.subtitle} />
      <div className={styles.article}>
        <Frontmatter frontmatter={frontmatter} />
        <Component
          components={{
            a: CustomLink,
            img: CustomImage,
            Image: CustomImage,
            ImageBlock: CustomImageBlock,
            CodeBlock: CustomCodeBlock,
          }}
        />
      </div>
    </div>
  )
}

export default Post
