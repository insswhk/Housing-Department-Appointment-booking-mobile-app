import { useEffect, useState, type ReactNode } from 'react'

/** Minimal Markdown → React renderer for Admin docs (no extra dependency). */
export function MarkdownDoc({ src }: { src: string }) {
  const [text, setText] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setText(null)
    setError(null)
    fetch(src)
      .then(async (res) => {
        if (!res.ok) throw new Error(`Could not load ${src} (${res.status})`)
        return res.text()
      })
      .then((body) => {
        if (!cancelled) setText(body)
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message)
      })
    return () => {
      cancelled = true
    }
  }, [src])

  if (error) return <p className="doc-error">{error}</p>
  if (text == null) return <p className="doc-loading">Loading documentation…</p>

  return <article className="markdown">{renderMarkdown(text)}</article>
}

function renderMarkdown(md: string): ReactNode[] {
  const lines = md.replace(/\r\n/g, '\n').split('\n')
  const nodes: ReactNode[] = []
  let i = 0
  let key = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.startsWith('```')) {
      const lang = line.slice(3).trim()
      const code: string[] = []
      i += 1
      while (i < lines.length && !lines[i].startsWith('```')) {
        code.push(lines[i])
        i += 1
      }
      i += 1
      nodes.push(
        <pre key={key++} className="md-code" data-lang={lang || undefined}>
          <code>{code.join('\n')}</code>
        </pre>,
      )
      continue
    }

    if (line.trim() === '---') {
      nodes.push(<hr key={key++} />)
      i += 1
      continue
    }

    if (line.startsWith('# ')) {
      nodes.push(<h1 key={key++}>{inline(line.slice(2))}</h1>)
      i += 1
      continue
    }
    if (line.startsWith('## ')) {
      nodes.push(<h2 key={key++}>{inline(line.slice(3))}</h2>)
      i += 1
      continue
    }
    if (line.startsWith('### ')) {
      nodes.push(<h3 key={key++}>{inline(line.slice(4))}</h3>)
      i += 1
      continue
    }

    if (line.startsWith('|')) {
      const rows: string[][] = []
      while (i < lines.length && lines[i].startsWith('|')) {
        const cells = lines[i]
          .split('|')
          .slice(1, -1)
          .map((c) => c.trim())
        // Skip markdown separator rows like |---|---|
        if (!cells.every((c) => /^:?-+:?$/.test(c))) {
          rows.push(cells)
        }
        i += 1
      }
      if (rows.length > 0) {
        const [header, ...body] = rows
        nodes.push(
          <div key={key++} className="md-table-wrap">
            <table>
              <thead>
                <tr>
                  {header.map((cell, idx) => (
                    <th key={idx}>{inline(cell)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {body.map((row, rIdx) => (
                  <tr key={rIdx}>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx}>{inline(cell)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>,
        )
      }
      continue
    }

    if (/^[-*] /.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^[-*] /.test(lines[i])) {
        items.push(lines[i].replace(/^[-*] /, ''))
        i += 1
      }
      nodes.push(
        <ul key={key++}>
          {items.map((item, idx) => (
            <li key={idx}>{inline(item)}</li>
          ))}
        </ul>,
      )
      continue
    }

    if (/^\d+\. /.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\. /, ''))
        i += 1
      }
      nodes.push(
        <ol key={key++}>
          {items.map((item, idx) => (
            <li key={idx}>{inline(item)}</li>
          ))}
        </ol>,
      )
      continue
    }

    if (line.trim() === '') {
      i += 1
      continue
    }

    nodes.push(<p key={key++}>{inline(line)}</p>)
    i += 1
  }

  return nodes
}

function inline(text: string): ReactNode {
  // Split on `code`, **bold**, and [label](url)
  const parts: ReactNode[] = []
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g
  let last = 0
  let match: RegExpExecArray | null
  let k = 0
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index))
    }
    const token = match[0]
    if (token.startsWith('`')) {
      parts.push(<code key={k++}>{token.slice(1, -1)}</code>)
    } else if (token.startsWith('**')) {
      parts.push(<strong key={k++}>{token.slice(2, -2)}</strong>)
    } else {
      const m = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
      if (m) {
        const href = m[2]
        const external = href.startsWith('http')
        parts.push(
          <a key={k++} href={href} {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}>
            {m[1]}
          </a>,
        )
      }
    }
    last = match.index + token.length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts.length === 1 ? parts[0] : parts
}
