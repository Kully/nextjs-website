import path from 'path'
import { readdirSync, readFileSync } from 'fs'
import matter from 'gray-matter'
import { bundleMDX } from 'mdx-bundler'
import { remarkMdxImages } from 'remark-mdx-images'
import readingTime from 'reading-time'

const getAllPostSlugs = (category) => {
  const blogPath = path.join(process.cwd(), 'data', category)

  // get directory name as slug for each post
  return readdirSync(blogPath, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name)
}

export const getAllPostPaths = (category) => {
  const allSlugs = getAllPostSlugs(category)

  // prepare path for each post
  return allSlugs.map((slug) => {
    return {
      params: {
        slug,
      },
    }
  })
}

export const getAllPostData = (category) => {
  const blogPath = path.join(process.cwd(), 'data', category)
  const allSlugs = getAllPostSlugs(category)

  // get data for each post
  const allPosts = allSlugs.map((slug) => {
    // read markdown file as string
    const dirPath = path.join(blogPath, slug)
    const filePath = path.join(dirPath, 'index.mdx')
    const fileContent = readFileSync(filePath, 'utf-8').trim()

    // use gray-matter to parse frontmatter
    const { data } = matter(fileContent)

    return {
      // add reading time and word count as frontmatter
      frontmatter: {
        wordCount: fileContent.split(/\s+/gu).length,
        readTime: readingTime(fileContent).text,
        ...data,
      },
      slug: slug,
    };
  })

  // sort posts by date
  return allPosts.sort(({ frontmatter: a }, { frontmatter: b }) => {
    if (a.date < b.date) {
      return 1
    } else if (a.date > b.date) {
      return -1
    } else {
      return 0
    }
  })
}

export const getSinglePostData = async (category, slug) => {
  const blogPath = path.join(process.cwd(), 'data', category)

  // read markdown file as string
  const dirPath = path.join(blogPath, slug)
  const filePath = path.join(dirPath, 'index.mdx')
  const fileContent = readFileSync(filePath, 'utf-8').trim()

  // acknowledge remark and rehype plugins
  const remarkPlugins = [remarkMdxImages]
  const rehypePlugins = []

  // ues mdx-bundler to parse code and frontmatter
  const { code, frontmatter } = await bundleMDX({
    source: fileContent,
    cwd: dirPath,
    xdmOptions: (options) => {
      options.remarkPlugins = [...(options.remarkPlugins ?? []), ...remarkPlugins]
      options.rehypePlugins = [...(options.rehypePlugins ?? []), ...rehypePlugins]
      return options
    },
    esbuildOptions: (options) => {
      options.loader = {
        ...options.loader,
        '.png': 'dataurl',
      }
      return options
    },
  })

  return {
    // add reading time and word count as frontmatter
    frontmatter: {
      wordCount: fileContent.split(/\s+/gu).length,
      readTime: readingTime(fileContent).text,
      ...frontmatter,
    },
    code: code,
  };
}
