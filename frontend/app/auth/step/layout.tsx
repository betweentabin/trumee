import StepLayout from './components/StepLayout';

export default function Layout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <StepLayout>
      {children}
    </StepLayout>
  )
}