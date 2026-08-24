import { Injectable } from '@nestjs/common';

@Injectable()
export class UtilsService {
  slugify(text: string): string {
    return (
      text
        .toString()
        .toLowerCase()
        // Convert Unicode variants to ASCII
        .replace(/[\uD835\uDC00-\uD835\uDFFF]/gu, (char) => {
          const code = char.codePointAt(0);
          if (!code) return char;

          // Mathematical Bold
          if (code >= 0x1d400 && code <= 0x1d419)
            return String.fromCharCode(code - 0x1d400 + 0x41);
          if (code >= 0x1d41a && code <= 0x1d433)
            return String.fromCharCode(code - 0x1d41a + 0x61);

          // Mathematical Italic
          if (code >= 0x1d434 && code <= 0x1d44d)
            return String.fromCharCode(code - 0x1d434 + 0x41);
          if (code >= 0x1d44e && code <= 0x1d467)
            return String.fromCharCode(code - 0x1d44e + 0x61);

          // Mathematical Bold Italic
          if (code >= 0x1d468 && code <= 0x1d481)
            return String.fromCharCode(code - 0x1d468 + 0x41);
          if (code >= 0x1d482 && code <= 0x1d49b)
            return String.fromCharCode(code - 0x1d482 + 0x61);

          return char;
        })
        .normalize('NFD') // Normalize to separate accents
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/\s+/g, '-') // Replace spaces with -
        .replace(/[^\w-]+/g, '') // Remove all non-word chars
        .replace(/--+/g, '-') // Replace multiple - with single -
        .replace(/^-+/, '') // Trim - from start of text
        .replace(/-+$/, '')
    ); // Trim - from end of text
  }
}
