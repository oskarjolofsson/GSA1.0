user_prompt = """
        Create a minimal, text-free instructional image plan for the following golf drill.

        DRILL FIELDS:
        - task: {self.task}
        - success_signal: {self.success_signal}
        - fault_indicator: {self.fault_indicator}
        
        RENDERING REQUIREMENTS:
        - The generated image(s) must contain NO words at all (no titles, labels, captions, callout boxes).
        - Allowed overlays: only simple dashed/solid guide lines, arrows, circles, and simple icons (check, X, stop). No letters/numbers.
        - Choose 1–2 frames (2 if a comparison/limit improves clarity).
        - Choose the best camera angle automatically (face-on or down-the-line) based on the drill.
        - Keep background plain and uncluttered.
        - Use a right-handed golfer unless the drill fields explicitly imply left-handed.

        OUTPUT:
        Return ONLY valid JSON matching the schema from the system instructions, including image_prompt and negative_prompt per frame.
        """
        
        
