import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from './table';

describe('Table', () => {
  it('renders basic table structure', () => {
    render(
      <Table>
        <TableCaption>Caption</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>H1</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>C1</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    expect(screen.getByText('Caption')).toBeInTheDocument();
    expect(screen.getByText('H1')).toBeInTheDocument();
    expect(screen.getByText('C1')).toBeInTheDocument();
  });
});

