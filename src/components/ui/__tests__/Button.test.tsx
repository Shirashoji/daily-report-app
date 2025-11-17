// src/components/ui/__tests__/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Button } from '../Button';

describe('Button', () => {
  test('子要素が正しくレンダリングされるべき', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByRole('button', { name: 'Click Me' })).toBeInTheDocument();
  });

  test('onClickハンドラがクリック時に呼び出されるべき', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);
    fireEvent.click(screen.getByText('Click Me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('variantとsizeに応じて正しいクラスが適用されるべき', () => {
    const { rerender } = render(
      <Button variant="primary" size="md">
        Primary
      </Button>
    );
    let button = screen.getByRole('button');
    expect(button).toHaveClass('bg-blue-500');
    expect(button).toHaveClass('py-2');

    rerender(
      <Button variant="secondary" size="sm">
        Secondary
      </Button>
    );
    button = screen.getByRole('button');
    expect(button).toHaveClass('bg-gray-500');
    expect(button).toHaveClass('py-1');

    rerender(
      <Button variant="danger" size="lg">
        Danger
      </Button>
    );
    button = screen.getByRole('button');
    expect(button).toHaveClass('bg-red-500');
    expect(button).toHaveClass('py-3');
  });

  test('disabled属性が渡された場合、ボタンは無効化されるべき', () => {
    const handleClick = jest.fn();
    render(
      <Button onClick={handleClick} disabled>
        Disabled
      </Button>
    );
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  test("isLoadingがtrueの場合、ボタンは無効化され、'Loading...'と表示されるべき", () => {
    const handleClick = jest.fn();
    render(
      <Button onClick={handleClick} isLoading>
        Loading
      </Button>
    );
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('Loading...');
    expect(screen.queryByText('Loading')).not.toBeInTheDocument();
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  test('カスタムのclassNameが適用されるべき', () => {
    render(<Button className="custom-class">Custom</Button>);
    expect(screen.getByRole('button')).toHaveClass('custom-class');
  });
});
