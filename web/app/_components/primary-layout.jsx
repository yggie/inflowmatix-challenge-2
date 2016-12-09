import preact from 'preact'
import PageRoot from '../page-root.jsx'
import PrimaryHeader from './primary-header.jsx'
import PageContainer from '../_layout/page-container.jsx'

export default class PrimaryLayout extends preact.Component {
  render() {
    const props = this.props

    return (
      <PageRoot {...props}>
        <PageContainer>
          <PrimaryHeader pageMetadata={props.pageMetadata}></PrimaryHeader>

          <main>
            {props.children}
          </main>
        </PageContainer>
      </PageRoot>
    )
  }
}
