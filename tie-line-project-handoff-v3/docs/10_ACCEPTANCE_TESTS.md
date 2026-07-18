# MVP Acceptance Tests

All required tests must pass.

## A. Launch and minimal screen

1. App opens directly into the current puzzle.
2. No dashboard appears before the board.
3. No title banner, instruction paragraph, statistics card, or permanent feedback panel appears during play.
4. Board occupies at least 85 percent of a 390 x 844 mobile viewport excluding browser chrome.
5. Instruction strip is visible and collapsible.
6. Visible active timer and three compact submission indicators are present.
7. Refresh restores current puzzle directly.

## B. Instructions

7. Instruction strip shows all seven facts in compact notation.
8. Instruction strip contains no explanatory paragraph.
9. Collapsing instructions leaves a small discoverable instruction control.
10. Entering Point mode can reveal the instruction strip again.

## C. Point placement

11. Point palette shows all unplaced role symbols.
12. Player can place a point by tap-then-tap.
13. Player can place a point by drag.
14. Unary melting points remain on their required frame edge.
15. Eutectic-row points remain on the 700°C row.
16. Low-temperature endpoints remain on the bottom edge.
17. Temporary coordinate readout appears during placement.
18. Coordinate readout disappears after placement.
19. Incorrect instruction coordinate is permitted by the editor when within the syntactic class.
20. Incorrect instruction coordinate receives no scientific correctness styling before submission when local checking is off.
21. Optional local invalidity checking, when enabled, highlights an incorrect placed coordinate without showing the correct coordinate.
22. Unconnected points can be moved.
23. Connected point movement previews attached geometry.
24. Point placement is undoable.

## D. Curve and horizontal drawing

24. Curve gesture begins only near a committed point.
25. Raw trace and clean preview are visually distinct.
26. Release near a valid endpoint commits a semantic curve.
27. Free endpoint is rejected.
28. Crossing is rejected.
29. Duplicate endpoint pair is rejected.
30. Wrong but structurally valid endpoint pair is accepted.
31. Selected curve exposes one handle.
32. Handle adjustment preserves endpoint incidence.
33. Horizontal snaps exactly to one temperature.
34. Horizontal incorporates the interior eutectic point.
35. Geometry changes are undoable.

## E. Face extraction

36. Correct geometry extracts exactly six fields.
37. Cosmetic handle adjustment does not change field identity.
38. A topology-changing deletion recomputes fields.
39. No field requires manual text positioning.

## F. Labelling

40. Phase palette contains `L`, `α`, and `β` only.
41. Tap-to-apply works.
42. Drag-to-apply works.
43. Phase remains active for repeated taps.
44. Insertion order is displayed.
45. Validation treats insertion order as irrelevant.
46. Duplicate token is ignored.
47. Three phases can be added to a 2-D field.
48. Erase removes one tapped phase only.
49. Invariant horizontal accepts phase tokens.


## G. Pre-submission behaviour

50. No default Check action is visible.
51. With local invalidity checking off, scientific mistakes receive no pre-submission correctness feedback.
52. The editor still rejects malformed crossings and free endpoints.
53. With local invalidity checking enabled, an incorrect instruction coordinate may be highlighted locally.
54. Optional local checking does not complain merely because the puzzle is incomplete.
55. Optional local checking does not compare a field directly against the hidden complete answer.
56. Player work is preserved when local feedback changes.


## H. Submit

57. The active screen shows three scored submission indicators.
58. Missing point produces Incomplete and consumes one submission.
59. Missing curve produces Incomplete and consumes one submission.
60. Empty required field produces Incomplete and consumes one submission.
61. Wrong point coordinate produces Incorrect.
62. Wrong endpoint incidence produces Incorrect.
63. Wrong field assemblage produces Incorrect.
64. Extra curve produces Incorrect.
65. Crossing or uninterpretable graph produces Malformed.
66. Correct topology and labels with different curve bows produces Solved.
67. `α + L` is accepted where `{L, α}` is expected.
68. First and second unsuccessful submissions preserve editing and keep the timer running.
69. Third unsuccessful submission ends the scored attempt and stops the timer.
70. After third failure, Continue unscored and Reveal solution are available.
71. Unscored continuation cannot later record a scored solve.

## I. Solved state

67. Editing handles fade.
68. Point affordances reduce or disappear.
69. No score dashboard appears.
70. Small next control appears.
71. Finished diagram remains visible.

## J. Persistence

72. Point placements persist after reload.
73. Curves persist after reload.
74. Labels and insertion order persist.
75. Viewport persists.
76. Solved state persists.
77. Submissions remaining, timer, and scored-attempt status persist.

## K. Mobile and accessibility

77. Works at 320 px width without horizontal page scrolling.
78. Touch hit targets are at least 44 px.
79. Pinch zoom and two-finger pan work.
80. One-finger drawing does not scroll the page.
81. Controls have accessible names.
82. Colour is not the only state signal.
83. Reduced-motion preference is respected.

## L. Scientific fixture

84. Golden fixture produces six fields.
85. Golden witness points map one-to-one to expected fields.
86. Invariant spans 10%B to 80%B at 700°C and includes 40%B interior point.
87. Hidden solution point coordinates match public instruction notation.
