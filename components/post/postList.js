import Link from 'next/link'
import Image from 'next/image'
import Frontmatter from './frontmatter'
import styles from './post.module.css'

const PostListItem = ({ category, post, index }) => {
  let image = null
  if ('image' in post.frontmatter) {
    image = <Image src={`/images/${category}/${post.slug}.png`} layout="fill" objectFit="cover" objectPosition="left top" />
  } else {
    image = <Image src={`/images/portfolio/admin-app.png`} layout="fill" objectFit="cover" objectPosition="left top" />
  }

  return (
    (<Link key={index} href={`/${category}/${post.slug}`} className={styles.link}>

      <div className={styles.item}>
        <div className={styles.image}>{image}</div>
        <Frontmatter frontmatter={post.frontmatter} />
      </div>

    </Link>)
  );
}

const PostList = ({ category, posts }) => (
  <div className={styles.page}>
    <h1 style={{textTransform: "uppercase"}}>{category}</h1>
    <div className={styles.list}>
      {posts.map((post, index) => (
        <PostListItem category={category} post={post} index={index} />
      ))}
    </div>
  </div>
)

export default PostList
