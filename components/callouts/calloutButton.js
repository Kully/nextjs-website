import Link from 'next/link'

const CalloutButton = ({ text = 'Click here', url = '' }) => {
  let callout = <button>{text}</button>
  if (url != '') {
    callout = (
      <Link href={url} style={{ textDecoration: 'none' }}>
        {callout}
      </Link>
    )
  }
  return callout
}

export default CalloutButton
