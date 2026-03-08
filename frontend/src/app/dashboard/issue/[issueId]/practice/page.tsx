type Props = {
  params: {
    issueId: string
  }
}

export default function PracticePage({ params }: Props) {
  return <div>Practice: {params.issueId}</div>
}