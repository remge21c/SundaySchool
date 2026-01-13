# UI/UX 배경색 문제 해결 요약

## 문제
- 모든 페이지의 배경색이 노란색으로 표시됨
- 브라우저에서 `rgb(255, 255, 0)` (노란색)으로 렌더링

## 원인
CSS 변수가 RGB 형식으로 저장되어 있었지만, Tailwind CSS와 Shadcn/UI는 HSL 형식의 CSS 변수를 사용합니다.

**문제 코드:**
```css
--background: 249 250 251; /* RGB 형식 */
```

Tailwind config에서는:
```typescript
background: 'hsl(var(--background))' // HSL 형식 기대
```

## 해결 방법
모든 CSS 변수를 RGB에서 HSL 형식으로 변환했습니다.

### 변환 예시
- `--background: 249 250 251` (RGB) → `--background: 210 14% 98%` (HSL)
- `--foreground: 17 24 39` (RGB) → `--foreground: 222 47% 11%` (HSL)
- `--primary: 59 130 246` (RGB) → `--primary: 217 91% 60%` (HSL)

### 주요 색상 변환
| 색상 | RGB (이전) | HSL (수정) | Hex |
|------|-----------|-----------|-----|
| Background | 249 250 251 | 210 14% 98% | #F9FAFB |
| Foreground | 17 24 39 | 222 47% 11% | #111827 |
| Primary | 59 130 246 | 217 91% 60% | #3B82F6 |
| Secondary | 245 158 11 | 38 92% 50% | #F59E0B |
| Card | 255 255 255 | 0 0% 100% | #FFFFFF |

## 검증
- ✅ CSS 변수가 HSL 형식으로 올바르게 설정됨
- ✅ 브라우저에서 배경색이 `rgb(249, 250, 251)` (밝은 회색)로 올바르게 표시됨
- ✅ 디자인 시스템 색상 팔레트에 맞게 적용됨

## 참고
- Tailwind CSS와 Shadcn/UI는 HSL 형식의 CSS 변수를 사용합니다
- 형식: `hue saturation lightness` (예: `210 14% 98%`)
- HSL 형식을 사용하면 다크 모드 전환이 더 쉬워집니다
