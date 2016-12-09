import preact from 'preact'
import PrimaryLayout from '../_components/primary-layout.jsx'
import ContentContainer from '../_layout/content-container.jsx'

export const PAGE_META = {
  title: 'Dummy blog post 1',
}

export default class DummyBlogPostPage extends preact.Component {
  render() {
    const { site } = this.props

    return (
      <PrimaryLayout pageMetadata={PAGE_META} site={site}>
        <ContentContainer>
          <p>This is some random text</p>

          <p>Some more random text</p>
        </ContentContainer>
      </PrimaryLayout>
    )
  }
}
