export interface Widget {
  id: string
  title: string
  type: 'weather' | 'clock' | 'notes' | 'custom'
  position: { x: number; y: number }
  size: { width: number; height: number }
}

export interface WidgetProps {
  widget: Widget
}
