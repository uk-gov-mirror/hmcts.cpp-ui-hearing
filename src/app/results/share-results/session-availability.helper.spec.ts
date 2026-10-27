import { DraftResult } from '../results.interfaces';
import { getBookingReferencesToCheck } from './session-availability.helper';

const buildDraftResult = (resultLines: Record<string, unknown>): DraftResult =>
  ({
    hearingId: 'hearingId',
    hearingDay: '2026-06-01',
    relations: [],
    shadowListedOffenceIds: [],
    resultLines
  } as unknown as DraftResult);

const bookingReferencePrompt = (value: string) => ({
  type: 'HIDDEN',
  promptId: 'booking-prompt-id',
  promptRef: 'bookingReference',
  label: 'Booking reference',
  value
});

const existingHearingPrompt = (value: string) => ({
  type: 'HIDDEN',
  promptId: 'existing-hearing-prompt-id',
  promptRef: 'existingHearingId',
  label: 'Existing hearing id',
  value
});

const amendedSince = (sharedPrompts: unknown[]) => ({
  sharedDate: '2026-06-01T10:00:00.000Z',
  amendmentDate: '2026-06-02T10:00:00.000Z',
  amendmentsLog: {
    isAmended: true,
    amendmentsRecord: [{ resultPromptsRecord: sharedPrompts }]
  }
});

const nextHearingLine = (resultLineId: string, prompts: unknown[], line = {}) => ({
  resultLineId,
  resultDefinitionId: 'resultDefinitionId',
  shortCode: 'NHMC',
  resultPrompts: prompts,
  ...line
});

describe('getBookingReferencesToCheck', () => {
  it('returns the booking reference of every result line that has not been shared', () => {
    const draftResult = buildDraftResult({
      'line-1': nextHearingLine('line-1', [bookingReferencePrompt('BOOKING1')]),
      'line-2': {
        ...nextHearingLine('line-2', [bookingReferencePrompt('BOOKING2')]),
        shortCode: 'NHCCS'
      }
    });

    expect(getBookingReferencesToCheck(draftResult)).toEqual(['BOOKING1', 'BOOKING2']);
  });

  it('returns a booking reference held by more than one result line once', () => {
    const draftResult = buildDraftResult({
      'line-1': nextHearingLine('line-1', [bookingReferencePrompt('BOOKING1')]),
      'line-2': nextHearingLine('line-2', [bookingReferencePrompt('BOOKING1')])
    });

    expect(getBookingReferencesToCheck(draftResult)).toEqual(['BOOKING1']);
  });

  it('ignores result lines without a booking reference', () => {
    const draftResult = buildDraftResult({ 'line-1': nextHearingLine('line-1', []) });

    expect(getBookingReferencesToCheck(draftResult)).toEqual([]);
  });

  it('ignores deleted result lines', () => {
    const draftResult = buildDraftResult({
      'line-1': nextHearingLine('line-1', [bookingReferencePrompt('BOOKING1')], { deleted: true })
    });

    expect(getBookingReferencesToCheck(draftResult)).toEqual([]);
  });

  it('ignores result lines attached to an existing hearing', () => {
    const draftResult = buildDraftResult({
      'line-1': nextHearingLine('line-1', [
        bookingReferencePrompt('BOOKING1'),
        existingHearingPrompt('EXISTINGHEARINGID')
      ])
    });

    expect(getBookingReferencesToCheck(draftResult)).toEqual([]);
  });

  it('ignores shared result lines that have not been amended since', () => {
    const draftResult = buildDraftResult({
      'line-1': nextHearingLine('line-1', [bookingReferencePrompt('BOOKING1')], {
        sharedDate: '2026-06-01T10:00:00.000Z'
      })
    });

    expect(getBookingReferencesToCheck(draftResult)).toEqual([]);
  });

  it('returns the booking reference of a shared result line whose session was changed since', () => {
    const draftResult = buildDraftResult({
      'line-1': nextHearingLine(
        'line-1',
        [bookingReferencePrompt('BOOKING2')],
        amendedSince([bookingReferencePrompt('BOOKING1')])
      )
    });

    expect(getBookingReferencesToCheck(draftResult)).toEqual(['BOOKING2']);
  });

  it('returns the booking reference of a shared result line amended since without changing its session', () => {
    const draftResult = buildDraftResult({
      'line-1': nextHearingLine(
        'line-1',
        [bookingReferencePrompt('BOOKING1')],
        amendedSince([bookingReferencePrompt('BOOKING1')])
      )
    });

    expect(getBookingReferencesToCheck(draftResult)).toEqual(['BOOKING1']);
  });

  it('returns a booking reference already shared by another result line', () => {
    const draftResult = buildDraftResult({
      'line-1': nextHearingLine('line-1', [bookingReferencePrompt('BOOKING1')], {
        sharedDate: '2026-06-01T10:00:00.000Z'
      }),
      'line-2': nextHearingLine('line-2', [bookingReferencePrompt('BOOKING1')])
    });

    expect(getBookingReferencesToCheck(draftResult)).toEqual(['BOOKING1']);
  });
});
