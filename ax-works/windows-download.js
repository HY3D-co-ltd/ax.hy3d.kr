async function showWindowsRelease() {
  const repository = 'HY3D-co-ltd/ax.hy3d.kr'
  const response = await fetch('https://api.github.com/repos/' + repository + '/releases/latest', {
    cache: 'no-store',
    credentials: 'omit'
  })
  if (!response.ok) return

  const release = await response.json()
  const version = /^ax-works-windows-v(\d+\.\d+\.\d+)$/.exec(release.tag_name)?.[1]
  if (!version || release.draft || release.prerelease) return

  const filename = 'AX-Works-' + version + '-Windows-x64-Setup.exe'
  const files = release.assets.filter(asset => asset.state === 'uploaded').map(asset => asset.name)
  if (!files.includes(filename) || !files.includes('SHA256SUMS.txt')) return

  const base = 'https://github.com/' + repository + '/releases/download/' + release.tag_name + '/'
  const download = document.getElementById('windows-download')
  download.href = base + filename
  download.textContent = 'Windows x64 설치 파일 다운로드 (' + version + ')'
  document.getElementById('windows-checksum').href = base + 'SHA256SUMS.txt'
}

// Keep the permanent download links when GitHub is unavailable or rate-limited.
showWindowsRelease().catch(() => {})
