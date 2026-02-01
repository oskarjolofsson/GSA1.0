import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AnalysisSidebar from './AnalysisSidebar';

describe('AnalysisSidebar Component', () => {

    const mockOnSelectAnalysis = vi.fn();
    const mockAllAnalyses = [
        { 
            analysis_id: 1, 
            createdAt: '2023-01-01T10:00:00Z' },
        { 
            analysis_id: 2, 
            createdAt: '2023-02-01T11:00:00Z' 
        },
    ]; 

    it('renders sidebar with title', () => {
        render(<AnalysisSidebar 
            allAnalyses={mockAllAnalyses} 
            activeAnalysis={null} 
            onSelectAnalysis={mockOnSelectAnalysis}  
        />);

        expect(screen.getByText('Your Analyses')).toBeInTheDocument();
    })

    // Display that there are no analysies when allAnalyses is empty

    it('renders sidebar with title', () => {
        const mockAllAnalysesEmpty = [];

        render(<AnalysisSidebar 
            allAnalyses={mockAllAnalysesEmpty} 
            activeAnalysis={null} 
            onSelectAnalysis={mockOnSelectAnalysis}  
        />);

        expect(screen.getByText('No analyses yet')).toBeInTheDocument();
    })


    // Render allAnalyses correctly when they are provided
    it('renders all analyses correctly', () => {
        render(<AnalysisSidebar 
            allAnalyses={mockAllAnalyses} 
            activeAnalysis={null} 
            onSelectAnalysis={mockOnSelectAnalysis}  
        />);

        expect(screen.getAllByRole('button').length).toBe(mockAllAnalyses.length + 1); // +1 for close button
    })


    // Calles on SelectAnalysis when an analysis is clicked
    it('calls onSelectAnalysis when an analysis is clicked', () => {
        render(<AnalysisSidebar 
            allAnalyses={mockAllAnalyses} 
            activeAnalysis={null} 
            onSelectAnalysis={mockOnSelectAnalysis}  
        />);
        
        // Check so that the first analysis button calls the function with correct id
        const analysisButton = screen.getByTestId('analysis-button-1');
        fireEvent.click(analysisButton);

        expect(mockOnSelectAnalysis).toHaveBeenCalledWith(1);
    })


    //  Highlights the active analysis correctly
    it('highlights the active analysis correctly', () => {
        render(<AnalysisSidebar 
            allAnalyses={mockAllAnalyses} 
            activeAnalysis={mockAllAnalyses[0]} 
            onSelectAnalysis={mockOnSelectAnalysis}  
        />);

        const activeButton = screen.getByTestId('analysis-button-1');
        expect(activeButton).toHaveClass('bg-emerald-500/10');
        expect(activeButton).toHaveClass('border-2');
        expect(activeButton).toHaveTextContent('Active');
        
    })


    // Toggles sidebar visibility when close button is clicked
    it('toggles sidebar visibility when close button is clicked', async () => {
        const { rerender } = render(<AnalysisSidebar 
            allAnalyses={mockAllAnalyses} 
            activeAnalysis={null} 
            onSelectAnalysis={mockOnSelectAnalysis}  
        />);
        
        // Sidebar should be open initially
        const closeButton = screen.getByTestId('close-sidebar-button');
        expect(closeButton).toBeInTheDocument();

        // Close the sidebar
        fireEvent.click(closeButton);

        // Open button should now be visible, not close button
        
        const openButton = screen.getByTestId('open-sidebar-button');
        expect(openButton).toBeInTheDocument();

        // Click open button
        fireEvent.click(openButton);

        // Close button should be visible again
        expect(screen.getByTestId('close-sidebar-button')).toBeInTheDocument();
    })
})