import { LanguageSupport, StreamLanguage } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import { isGroup, isIP } from 'hed2-parser';

const tagMap = {
  ip: tags.atom.toString(),
  host: tags.variableName.toString(),
  group: tags.propertyName.toString(),
  comment: tags.comment.toString(),
};

const hostsLang = StreamLanguage.define({
  name: 'hosts',
  startState() {
    return {
      group: '',
      groupSet: new Set<string>(),
    };
  },
  token(stream, state) {
    if (stream.eatSpace()) {
      return null;
    }

    if (stream.peek() === '#') {
      const line = stream.string.trim();
      stream.skipToEnd();
      if (!isGroup(line) || state.groupSet.has(line)) {
        return tagMap.comment;
      }
      if (state.group) {
        if (state.group === line) {
          state.group = '';
          state.groupSet.add(line);
          return tagMap.group;
        }
        return tagMap.comment;
      }
      state.group = line;
      return tagMap.group;
    }

    if (stream.eat('#')) {
      stream.skipToEnd();
      return tagMap.comment;
    }

    if (stream.eatWhile(/[^\s#]/)) {
      const token = stream.current();
      if (token) {
        if (isIP(token)) {
          return tagMap.ip;
        }
        return tagMap.host;
      }
    }

    stream.skipToEnd();
    return null;
  },
});

export const hostsLangSupport = new LanguageSupport(hostsLang);
