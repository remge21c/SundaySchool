'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const ONBOARDING_STORAGE_KEY = 'onboarding_completed';

interface TutorialStep {
  title: string;
  description: string;
  content: string;
}

const tutorialSteps: TutorialStep[] = [
  {
    title: '반 선택하기',
    description: '사이드바에서 계층 구조를 확인하세요',
    content: '유년부 > 3학년 > 사랑반 순서로 반을 선택할 수 있습니다. 사이드바에서 쉽게 이동할 수 있어요.',
  },
  {
    title: '출석 체크하기',
    description: '학생 카드를 터치하여 출석을 체크하세요',
    content: '학생 카드를 한 번 터치하면 출석이 체크됩니다. 결석인 경우 사유를 선택할 수 있어요.',
  },
  {
    title: '심방 기록하기',
    description: '심방 탭에서 학생과의 소통을 기록하세요',
    content: '전화, 방문, 카카오톡 등 다양한 방식의 심방을 기록할 수 있습니다. 기도 제목도 함께 남길 수 있어요.',
  },
];

/**
 * 온보딩 튜토리얼 컴포넌트
 * 첫 사용자에게만 표시되는 3단계 튜토리얼
 */
export function OnboardingTutorial() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    // localStorage에서 완료 여부 확인
    const completed = localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true';
    setIsCompleted(completed);
  }, []);

  // 이미 완료된 경우 아무것도 렌더링하지 않음
  if (isCompleted) {
    return null;
  }

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    setIsCompleted(true);
  };

  const handleSkip = () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    setIsCompleted(true);
  };

  const currentTutorial = tutorialSteps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === tutorialSteps.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">
              {currentTutorial.title}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="text-muted-foreground"
            >
              건너뛰기
            </Button>
          </div>
          <CardDescription>
            {currentTutorial.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {currentTutorial.content}
            </p>
          </div>

          {/* 진행 표시 */}
          <div className="flex items-center justify-center gap-2">
            {tutorialSteps.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-2 rounded-full ${
                  index === currentStep
                    ? 'bg-primary'
                    : index < currentStep
                    ? 'bg-primary/50'
                    : 'bg-muted'
                }`}
                aria-label={`Step ${index + 1}`}
              />
            ))}
          </div>

          {/* 버튼 */}
          <div className="flex items-center justify-between gap-2">
            {!isFirstStep && (
              <Button variant="outline" onClick={handlePrevious}>
                이전
              </Button>
            )}
            <div className={isFirstStep ? 'ml-auto' : ''} />
            <Button onClick={handleNext} className="ml-auto">
              {isLastStep ? '시작하기' : '다음'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
