/**
 * Parse SRT (SubRip) subtitle file format
 * 
 * SRT format example:
 * 1
 * 00:00:01,000 --> 00:00:04,000
 * This is the first subtitle
 * 
 * 2
 * 00:00:05,000 --> 00:00:08,000
 * This is the second subtitle
 */

interface SubtitleEntry {
  index: number;
  startTime: string;
  endTime: string;
  text: string;
}

/**
 * Parse SRT content and extract all subtitle text
 * @param srtContent - Raw SRT file content
 * @returns Concatenated subtitle text
 */
export function parseSRT(srtContent: string): string {
  if (!srtContent || typeof srtContent !== 'string') {
    throw new Error('Invalid SRT content');
  }

  // Split by double newlines (subtitle entries separator)
  const entries = srtContent.split(/\n\s*\n/);
  const subtitles: SubtitleEntry[] = [];

  for (const entry of entries) {
    const lines = entry.trim().split('\n');
    
    if (lines.length < 3) {
      continue; // Skip invalid entries
    }

    // First line is the index
    const index = parseInt(lines[0], 10);
    
    // Second line is the timestamp
    const timestampMatch = lines[1].match(/(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})/);
    
    if (!timestampMatch) {
      continue; // Skip if timestamp format is invalid
    }

    const startTime = timestampMatch[1];
    const endTime = timestampMatch[2];

    // Remaining lines are the subtitle text
    const text = lines.slice(2).join(' ').trim();

    if (text && !isNaN(index)) {
      subtitles.push({
        index,
        startTime,
        endTime,
        text: cleanSubtitleText(text),
      });
    }
  }

  // Concatenate all subtitle text
  return subtitles.map(sub => sub.text).join(' ');
}

/**
 * Clean subtitle text by removing HTML tags, formatting, and extra whitespace
 * @param text - Raw subtitle text
 * @returns Cleaned text
 */
function cleanSubtitleText(text: string): string {
  return text
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove formatting tags like {y:i}
    .replace(/\{[^}]*\}/g, '')
    // Remove square bracket annotations like [MUSIC] or [DOOR OPENS]
    .replace(/\[[^\]]*\]/g, '')
    // Remove parentheses annotations like (LAUGHS) or (sighs)
    .replace(/\([^)]*\)/g, '')
    // Replace multiple spaces with single space
    .replace(/\s+/g, ' ')
    // Trim whitespace
    .trim();
}

/**
 * Parse SRT content and return structured subtitle entries
 * @param srtContent - Raw SRT file content
 * @returns Array of subtitle entries
 */
export function parseSRTToEntries(srtContent: string): SubtitleEntry[] {
  if (!srtContent || typeof srtContent !== 'string') {
    throw new Error('Invalid SRT content');
  }

  const entries = srtContent.split(/\n\s*\n/);
  const subtitles: SubtitleEntry[] = [];

  for (const entry of entries) {
    const lines = entry.trim().split('\n');
    
    if (lines.length < 3) {
      continue;
    }

    const index = parseInt(lines[0], 10);
    const timestampMatch = lines[1].match(/(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})/);
    
    if (!timestampMatch || isNaN(index)) {
      continue;
    }

    const text = lines.slice(2).join(' ').trim();

    if (text) {
      subtitles.push({
        index,
        startTime: timestampMatch[1],
        endTime: timestampMatch[2],
        text: cleanSubtitleText(text),
      });
    }
  }

  return subtitles;
}
