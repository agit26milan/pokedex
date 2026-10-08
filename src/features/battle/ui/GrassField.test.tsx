import { render } from '@testing-library/react-native';

import { GRASS_BLADE_COUNT, GrassField } from './GrassField';

describe('GrassField', () => {
  it('draws every blade once and nothing more', async () => {
    const view = await render(<GrassField />);

    expect(view.getAllByTestId('grass-blade')).toHaveLength(GRASS_BLADE_COUNT);
    expect(GRASS_BLADE_COUNT).toBe(41);
  });

  it('never takes a touch away from the battle controls', async () => {
    const view = await render(<GrassField />);

    expect(view.getByTestId('grass-field').props.pointerEvents).toBe('none');
  });
});
