import preact from 'preact'
import PrimaryLayout from './_components/primary-layout.jsx'
import ContentContainer from './_layout/content-container.jsx'

export const PAGE_META = {
  title: 'My Blog',
}

export default class IndexPage extends preact.Component {
  render() {
    const { site } = this.props

    return (
      <PrimaryLayout pageMetadata={PAGE_META} site={site}>
        <ContentContainer>
          <h1>This is the blog page!</h1>

          <p>Various links to all those bloggy goodness:</p>

          <ul>
            {(site.blogPosts().map((post) => {
              return (
                <li>
                  <a href={`/blog/${post.subpath()}`}>
                    {post.title()}
                    <br/>
                    Date: {String(post.publishedDate())}
                  </a>
                </li>
              )
            }))}
          </ul>
        </ContentContainer>
      </PrimaryLayout>
    )
  }
}
