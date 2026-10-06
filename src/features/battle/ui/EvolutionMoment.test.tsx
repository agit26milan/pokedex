import { act, render } from '@testing-library/react-native';

import { EVOLUTION_DURATION, EvolutionMoment } from './EvolutionMoment';

jest.mock('@/shared/components/Sprite', () => ({ Sprite: () => null }));

const props = { fromId: 1, fromName: 'bulbasaur', toId: 2, toName: 'ivysaur' };

describe('EvolutionMoment', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('names the change and reports completion exactly once', async () => {
    const onDone = jest.fn();
    const view = await render(<EvolutionMoment {...props} onDone={onDone} />);

    expect(view.getByText('Bulbasaur is evolving…')).toBeTruthy();
    expect(onDone).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(EVOLUTION_DURATION + 200);
    });

    expect(onDone).toHaveBeenCalledTimes(1);
    expect(view.getByText('Bulbasaur became Ivysaur!')).toBeTruthy();
  });

  it('leaves no timer behind when the moment is left early', async () => {
    const onDone = jest.fn();
    const view = await render(<EvolutionMoment {...props} onDone={onDone} />);

    await act(async () => {
      view.unmount();
    });

    await act(async () => {
      jest.advanceTimersByTime(EVOLUTION_DURATION + 400);
    });

    expect(onDone).not.toHaveBeenCalled();
  });
});
