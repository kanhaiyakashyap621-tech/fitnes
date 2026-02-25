import { useIsMobile } from '../hooks/useIsMobile'

const MobileNotice = () => {
  const isMobile = useIsMobile()

  if (isMobile) return null

  return (
    <div className="mobile-warning">
      Athletes Arena works best on mobile devices.
    </div>
  )
}

export default MobileNotice
