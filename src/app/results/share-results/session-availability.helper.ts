import { uniq } from 'lodash-es';
import {
  isActiveDraftResultLine,
  isDirtyDraftResultLine,
  isResolvedDraftResultLine
} from '../core/helpers';
import {
  AnyDraftResultLine,
  DraftResult,
  DraftResultPrompt,
  ResolvedDraftResultLine
} from '../results.interfaces';

const BOOKING_REFERENCE_PROMPT_REF = 'bookingReference';
const EXISTING_HEARING_PROMPT_REF = 'existingHearingId';

const findPromptValue = (prompts: DraftResultPrompt[], promptRef: string): string | undefined =>
  prompts.find(prompt => prompt.promptRef === promptRef)?.value as string;

/**
 * Get the booking references whose reserved session must still be held before
 * the draft result can be shared. Only active result lines changed since they
 * were last shared are considered, skipping those attached to an existing
 * hearing.
 *
 * @param draftResult the draft result to be shared
 * @returns the booking references to check
 */
export const getBookingReferencesToCheck = (draftResult: DraftResult): string[] => {
  const resultLines = Object.values(draftResult.resultLines) as AnyDraftResultLine[];

  return uniq(
    resultLines
      .filter(
        (resultLine): resultLine is ResolvedDraftResultLine =>
          isResolvedDraftResultLine(resultLine) &&
          isActiveDraftResultLine(resultLine) &&
          isDirtyDraftResultLine(resultLine)
      )
      .map(({ resultPrompts = [] }) => resultPrompts)
      .filter(resultPrompts => !findPromptValue(resultPrompts, EXISTING_HEARING_PROMPT_REF))
      .map(resultPrompts => findPromptValue(resultPrompts, BOOKING_REFERENCE_PROMPT_REF))
      .filter(Boolean)
  );
};
