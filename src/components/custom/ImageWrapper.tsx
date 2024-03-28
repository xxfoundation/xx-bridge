import React from 'react'

const ImageWrapper: React.FC<{
  src: string
  alt: string
  height?: string
  width?: string
}> = ({ src, alt, height = 'auto', width = 'auto' }) => (
  <img height={height} width={width} src={src} alt={alt} loading="lazy" />
)

export default ImageWrapper
