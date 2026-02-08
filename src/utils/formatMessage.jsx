/**
 * Format agent message text with markdown-style formatting
 * Handles line breaks, bold text, and bullet points
 */

/**
 * Format a message string with markdown-like formatting
 * @param {string} text - The raw message text
 * @returns {JSX.Element} Formatted message with proper styling
 */
export function formatMessage(text) {
    if (!text) return null

    // Split by lines
    const lines = text.split('\n')
    
    return (
        <>
            {lines.map((line, idx) => {
                // Skip empty lines but preserve them as spacing
                if (line.trim() === '') {
                    return <br key={idx} />
                }

                // Format the line content
                const formattedLine = formatLine(line)
                
                return (
                    <div key={idx} style={{ marginBottom: '8px' }}>
                        {formattedLine}
                    </div>
                )
            })}
        </>
    )
}

/**
 * Format a single line with inline formatting (bold, etc.)
 * @param {string} line - A single line of text
 * @returns {JSX.Element|string} Formatted line
 */
function formatLine(line) {
    // Check if it's a bullet point
    const bulletMatch = line.match(/^(\s*)\*{1,2}\s*(.+)/)
    if (bulletMatch) {
        const [, indent, content] = bulletMatch
        return (
            <div style={{ 
                paddingLeft: `${indent.length * 8 + 20}px`,
                display: 'flex',
                gap: '8px'
            }}>
                <span style={{ flexShrink: 0 }}>•</span>
                <span>{formatInlineStyles(content)}</span>
            </div>
        )
    }

    // Regular line - just format inline styles
    return formatInlineStyles(line)
}

/**
 * Format inline markdown-style formatting (**bold**)
 * @param {string} text - Text with potential inline formatting
 * @returns {JSX.Element|string} Formatted content
 */
function formatInlineStyles(text) {
    // Split by **text** for bold
    const parts = text.split(/(\*\*[^*]+\*\*)/)
    
    if (parts.length === 1) {
        // No formatting
        return text
    }

    return (
        <>
            {parts.map((part, idx) => {
                // Check if this part is bold (**text**)
                const boldMatch = part.match(/^\*\*([^*]+)\*\*$/)
                if (boldMatch) {
                    return <strong key={idx}>{boldMatch[1]}</strong>
                }
                return <span key={idx}>{part}</span>
            })}
        </>
    )
}
