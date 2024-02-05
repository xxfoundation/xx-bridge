interface StyleParams {
  footerHeight: string
}

const getStyles = (styleParams: StyleParams) => ({
  footer: {
    position: 'fixed',
    width: '100%',
    height: styleParams.footerHeight,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  }
})

export default getStyles
