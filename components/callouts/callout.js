import Link from 'next/link'

const Callout = ({ text = 'Click here', url = '' }) => {
  let callout = <h6 style={{ color: 'var(--color-primary)' }}>{text}</h6>
  if (url != '') {
    callout = (
      (<Link href={url} style={{ textDecoration: 'none' }} target="_blank">

        {callout}

      </Link>)
    )
  }
  return callout
}

export default Callout
